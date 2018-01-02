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
    my $str = "ABCDEF";
    my $t_a0_true = (substr $str, 0, length("A")) eq ("A");
    my $t_a1_false = (substr $str, 1, length("A")) eq ("A");
    my $t_b1_true = (substr $str, 1, length("B")) eq ("B");
    my $t_c_d2_true = (substr $str, 2, length("CD")) eq ("CD");
    print(("@{[($t_a0_true) ? 'true' : 'false']} @{[($t_a1_false) ? 'true' : 'false']} @{[($t_b1_true) ? 'true' : 'false']} @{[($t_c_d2_true) ? 'true' : 'false']}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}