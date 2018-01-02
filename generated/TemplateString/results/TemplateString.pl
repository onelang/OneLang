use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $str_val = "str";
    my $num = 1337;
    my $b = 1;
    my $result = "before @{[$str_val]}, num: @{[$num]}, true: @{[($b) ? 'true' : 'false']} after";
    print(($result) . "\n");
    print(("before @{[$str_val]}, num: @{[$num]}, true: @{[($b) ? 'true' : 'false']} after") . "\n");
    
    my $result2 = "before " . $str_val . ", num: " . $num . ", true: " . (($b) ? "true" : "false") . " after";
    print(($result2) . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}