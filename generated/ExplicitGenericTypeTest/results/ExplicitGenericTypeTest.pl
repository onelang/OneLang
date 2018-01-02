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
    my $result = [];
    my $map = {
      x => 5,
    };
    my $keys = keys $map;
    print(($result) . "\n");
    print(($keys) . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}